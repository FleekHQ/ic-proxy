# Simple HTTP Gateway to the Internet Computer

Gateway supports 2 modes - using browser service worker or fully proxied.


## Service Worker

Initial request is handled by the proxy server returning simple html that installs service worker to your browser. Once service worker is ready, web page is reloaded which results in fetching contents directly from Internet Computer network (with no intermediary servers between you and IC Gateway).


## Proxied requests

When it's not possible to use service worker, proxy mode is enabled. This is useful if you want to support link previews or any bot-like access (eg. search engines).

## Basic flow
![Request Flow](./schema.jpg?raw=true "Request flow")

Example CRA: https://tcrwk-zqaaa-aaaaa-qabdq-cai.ic.fleek.co

