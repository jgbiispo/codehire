import * as auth from "./auth_controller/index.js";
import * as user from "./user_controller/index.js";
import * as company from "./company_controller/index.js";
import * as application from "./application_controller/index.js";
import * as job from "./job_controller/index.js";
import * as feed from "./feed_controller/index.js";
import * as tag from "./tag_controller/index.js";
import * as admin from "./admin_controller/index.js";

export const controllers = Object.freeze({
  auth,
  user,
  company,
  application,
  job,
  feed,
  tag,
  admin
});

export {
  auth,
  user,
  company,
  application,
  job,
  feed,
  tag,
  admin
};

export default controllers;
