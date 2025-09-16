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

// Company controllers
import listCompanies from "./company_controller/list_companies.controller.js";
import getCompanyBySlug from "./company_controller/get_company_by_slug.controller.js";
import updateCompany from "./company_controller/update_company.controller.js";
import verifyCompany from "./company_controller/verify_company.controller.js";
import createCompany from "./company_controller/create_company.controller.js";

// Application controllers
import applyToJob from "./application_controller/apply_to_job.controller.js";
import listEmployerApplications from "./application_controller/list_employer_applications.controller.js";
import getApplicationById from "./application_controller/get_application_by_id.controller.js";
import updateApplicationStatus from "./application_controller/update_application_status.controller.js";
import deleteApplication from "./application_controller/delete_application.controller.js";

// Job controllers
import createJob from "./job_controller/create_job.controller.js";

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

export function companyControllers() {
  return {
    listCompanies,
    createCompany,
    getCompanyBySlug,
    updateCompany,
    verifyCompany,
  };
}

export function applicationControllers() {
  return {
    applyToJob,
    listEmployerApplications,
    getApplicationById,
    updateApplicationStatus,
    deleteApplication,
  };
}

export function jobControllers() {
  return {
    createJob,
  };
}