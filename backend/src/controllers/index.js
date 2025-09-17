import * as auth from "./auth_controller/index.js";
import * as user from "./user_controller/index.js";
import * as company from "./company_controller/index.js";
import * as application from "./application_controller/index.js";
import * as job from "./job_controller/index.js";

export const controllers = Object.freeze({ auth, user, company, application, job });

export { auth, user, company, application, job };

export default controllers;
