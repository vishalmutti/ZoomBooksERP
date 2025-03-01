/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

console.log("PDF.js worker initialized");

// Basic worker functionality to handle messages
self.onmessage = function(event) {
  console.log("PDF.js worker received message:", event.data);
  
  // Send a response back to the main thread
  self.postMessage({
    type: "ready",
    message: "PDF.js worker is ready"
  });
};
