// Auth controllers
import register from "./auth_controller/register.controller.js";
import login from "./auth_controller/login.controller.js";
import refresh from "./auth_controller/refresh.controller.js";
import logout from "./auth_controller/logout.controller.js";

// User controllers
import getMe from "./user_controller/get_me.controller.js";
import patchMe from "./user_controller/patch_me.controller.js";
import list_bookmarks from "./user_controller/list_bookmarks.controller.js";
import list_my_applications from "./user_controller/list_my_applications.controller.js";


export function authControllers() {
  return {
    register,
    login,
    refresh,
    logout,
  };
}

export function userControllers() {
  return {
    getMe,
    patchMe,
    list_bookmarks,
    list_my_applications,
  };
}