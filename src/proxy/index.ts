import {
  APIGatewayProxyEvent,
  APIGatewayProxyCallback,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import * as fs from "fs";
import * as path from "path";
import { lookup } from "mime-types";

import createActorFactory from "./utils/createActorFactory";
import createAgent from "./utils/createAgent";

const isbot = require("isbot");
const agent = createAgent();
const actorFactory = createActorFactory(agent);

const serviceWorkerPath = "serviceWorker.js";
const bootstrapBundles = ["index.html", serviceWorkerPath];

type ErrorCallback = (error: Error) => void;

const createResponse = (
  pathname: string,
  bytes: Buffer | Uint8Array
): APIGatewayProxyResult => {
  const contentType = lookup(pathname);
  const isBase64 = contentType && contentType.indexOf("image") >= 0;

  return {
    statusCode: 200,
    body: Buffer.from(bytes).toString(isBase64 ? "base64" : undefined),
    headers: {
      "Content-Type": contentType,
    },
    isBase64Encoded: isBase64,
  };
};

const canisterFetch = async (
  canisterId: string,
  pathname: string
): Promise<Buffer> => {
  const actorInterface = actorFactory({
    canisterId,
  });

  const bytes = (await actorInterface.retrieve(pathname)) as Uint8Array;
  return Buffer.from(bytes);
};

const notFoundCallback = (callback: APIGatewayProxyCallback): ErrorCallback => (
  error: Error
): void => {
  console.log("Error", error);

  callback(null, {
    statusCode: 404,
    body: "Not found.",
    isBase64Encoded: false,
  });
};

/**
 * Receives an array of headers and extract the value from the cookie header
 * @param  {String}   errors List of errors
 * @return {Object}
 */
function isProxyForced(headers: Record<string, string>) {
  if (
    headers === null ||
    headers === undefined ||
    headers.Cookie === undefined
  ) {
    return false;
  }

  return headers.Cookie.indexOf("proxy_force_http=1") >= 0;
}

export const handler = async function (
  event: APIGatewayProxyEvent,
  _context: Context,
  callback: APIGatewayProxyCallback
): Promise<void> {
  let pathname = event.requestContext.path;
  const parsedPath = path.parse(pathname);

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  pathname = pathname.substr(1);

  let isBot =
    isbot(event.requestContext.identity.userAgent) ||
    isProxyForced(event.headers);

  const canisterId = event.requestContext.domainName.split(".").shift();

  // render bootstrap bundles
  if (!isBot && bootstrapBundles.indexOf(pathname) >= 0) {
    let bytes = fs.readFileSync(`dist/${pathname}`);

    if (pathname === serviceWorkerPath) {
      bytes = Buffer.from(bytes.toString().replace(":canisterId:", canisterId));
    }

    return callback(null, createResponse(pathname, bytes));
  }

  const isHtml = parsedPath.ext !== "html";
  // if there's an extension in URL
  // we'll try to load asset from IC right away
  // html will be fetched only for bots
  if (parsedPath.ext.length >= 0 && (isBot || isHtml)) {
    return canisterFetch(canisterId, pathname)
      .then((buff) => {
        return callback(null, createResponse(pathname, buff));
      })
      .catch(notFoundCallback(callback));
  }

  // for any html page, we'll try to load bootstrap if it's not a bot
  if (isHtml && !isBot) {
    const bytes = fs.readFileSync(`dist/index.html`);
    return callback(null, createResponse(pathname, bytes));
  }

  if (isHtml && isBot) {
    return canisterFetch(canisterId, pathname)
      .then((buff) => {
        return callback(null, createResponse(pathname, buff));
      })
      .catch((e) => {
        if (!pathname.endsWith("index.html") || parsedPath.dir === "") {
          return notFoundCallback(callback)(e);
        } else {
          return canisterFetch(canisterId, "index.html")
            .then((buff) => {
              return callback(null, createResponse(pathname, buff));
            })
            .catch(notFoundCallback(callback));
        }
      });
  }

  return callback(null, {
    statusCode: 404,
    body: "Not found.",
    isBase64Encoded: false,
  });
};
