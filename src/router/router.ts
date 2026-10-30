import { createRouter, createWebHistory } from "vue-router";
import { ROLES, applyTheme, isRole } from "@/lib/theme";
import { useAuthStore } from "@/stores/auth";
import type { Role } from "@/lib/theme";

declare module "vue-router" {
  interface RouteMeta {
    role?: Role;
    title?: string;
    requiresAuth?: boolean;
    roles?: readonly Role[];
    administratorOnly?: boolean;
    // Only for visitors; signed-in users are sent to the dashboard.
    guestOnly?: boolean;
  }
}

const DEFAULT_LOGIN_ROLE = "admin";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: `/login/:role(${ROLES.join("|")})`,
      name: "login",
      component: () => import("@/views/LoginView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { role: "surveyor" },
    },
    {
      path: "/",
      name: "landing",
      component: () => import("@/views/LandingView.vue"),
    },
    {
      path: "/ajukan-komplain",
      name: "complain-submit",
      component: () => import("@/views/ComplainSubmitView.vue"),
      meta: { guestOnly: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/AppLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/views/dashboard/DashboardView.vue"),
          meta: { title: "Dashboard" },
        },
        {
          path: "master/bencana",
          name: "master-bencana",
          component: () => import("@/views/master-data/DisasterView.vue"),
          meta: {
            title: "Master Disaster",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "/assessment/loss",
          name: "loss-assessment",
          component: () => import("@/views/assessment/LossAssessmentView.vue"),
          meta: {
            title: "Master Disaster",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "/assessment/house-damage",
          name: "house-damage-assessment",
          component: () =>
            import("@/views/assessment/HouseDamageAssessmentView.vue"),
          meta: {
            title: "Master Disaster",
            roles: ["admin"],
            administratorOnly: true,
          },
        },

        {
          path: "master/provinsi",
          name: "master-provinsi",
          component: () => import("@/views/master-data/ProvinceView.vue"),
          meta: {
            title: "Provinsi",
            roles: ["admin"],
            administratorOnly: true,
          },
        },

        {
          path: "master/kabupaten-kota",
          name: "master-kabupaten-kota",
          component: () => import("@/views/master-data/RegencyView.vue"),
          meta: {
            title: "Kabupaten/Kota",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "master/kecamatan",
          name: "master-kecamatan",
          component: () => import("@/views/master-data/DistrictView.vue"),
          meta: {
            title: "Kecamatan",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "master/desa",
          name: "master-desa",
          component: () => import("@/views/master-data/VillageView.vue"),
          meta: {
            title: "Desa/Kelurahan",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "master/komponen-rumah",
          name: "master-komponen-rumah",
          component: () => import("@/views/master-data/HousingPartView.vue"),
          meta: {
            title: "Assessmen Komponen Rumah",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "master/sektor",
          name: "master-sektor",
          component: () => import("@/views/master-data/SectorView.vue"),
          meta: {
            title: "Sektor",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "user/surveyors",
          name: "surveyors",
          component: () => import("@/views/user/SurveyorsView.vue"),
          meta: { title: "Data Surveyor", roles: ["admin"] },
        },
        {
          path: "user/admins",
          name: "admins",
          component: () => import("@/views/user/AdminsView.vue"),
          meta: {
            title: "Admin Monitoring",
            roles: ["admin"],
            administratorOnly: true,
          },
        },
        {
          path: "survey",
          name: "survey-list",
          component: () => import("@/views/survey/SurveyView.vue"),
          meta: {
            title: "Survey",
            roles: ["surveyor", "admin"],
          },
        },
        {
          path: "/survey/create",
          name: "survey-create",
          component: () => import("@/views/survey/SurveyForm.vue"),
          props: { isEdit: false },
          meta: {
            title: "Create Survey",
            roles: ["surveyor"],
          },
        },
        {
          path: "/survey/:id/edit",
          name: "survey-edit",
          component: () => import("@/views/survey/SurveyForm.vue"),
          props: (route) => ({ isEdit: true, id: route.params.id }),
          meta: {
            title: "Edit Survey",
            roles: ["surveyor"],
          },
        },
        {
          path: "/survey/:id",
          name: "survey-detail",
          component: () => import("@/views/survey/SurveyForm.vue"),
          props: (route) => ({ isEdit: false, id: route.params.id }),
          meta: {
            title: "Detail Survey",
          },
        },
        {
          path: "complain",
          name: "complain-list",
          component: () => import("@/views/complain/ComplainView.vue"),
          meta: {
            title: "Complain",
            roles: ["surveyor"],
          },
        },
        {
          path: "complain/:id",
          name: "complain-detail",
          component: () => import("@/views/complain/ComplainDetailView.vue"),
          meta: {
            title: "Complain Detail",
            roles: ["surveyor"],
          },
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("@/views/ProfileView.vue"),
          meta: { title: "Profil" },
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "login", params: { role: DEFAULT_LOGIN_ROLE } },
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.role)
    return { name: "login", params: { role: DEFAULT_LOGIN_ROLE } };

  if ((to.name === "login" || to.name === "register") && auth.role)
    return { name: "dashboard" };

  if (to.meta.guestOnly && auth.role) return { name: "dashboard" };

  if (to.meta.roles && auth.role && !to.meta.roles.includes(auth.role))
    return { name: "dashboard" };

  if (to.meta.administratorOnly && auth.isMonitoring)
    return { name: "dashboard" };

  // Login and register pages use their own role; everywhere else a signed-in user's role applies, and visitors get the admin (default) theme.
  const role = to.params.role ?? to.meta.role ?? auth.role;
  applyTheme(typeof role === "string" && isRole(role) ? role : null);
});

export default router;
