import {
  RiDashboardLine,
  RiDatabase2Line,
  RiTeamLine,
  RiUserLine,
  RiSurveyLine,
  RiSurveyFill,
  RiEmotionUnhappyLine,
} from "@remixicon/vue";
import type { Component } from "vue";
import type { Role } from "@/lib/theme";

export interface NavLeaf {
  label: string;
  to: string;
  administratorOnly?: boolean;
}

// An item has either `to` (a plain link) or `children` (an expandable group).
export interface NavItem {
  label: string;
  icon: Component;
  roles: readonly Role[];
  to?: string;
  children?: readonly NavLeaf[];
  administratorOnly?: boolean;
}

// Placeholder menu. Replace with the real feature list once it is decided.
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: RiDashboardLine,
    roles: ["admin", "surveyor"],
  },
  {
    label: "Master",
    icon: RiDatabase2Line,
    roles: ["admin"],
    administratorOnly: true,
    children: [
      { label: "Bencana", to: "/master/bencana" },
      { label: "Provinsi", to: "/master/provinsi" },
      { label: "Kabupaten/Kota", to: "/master/kabupaten-kota" },
      { label: "Kecamatan", to: "/master/kecamatan" },
      { label: "Desa/Kelurahan", to: "/master/desa" },
      { label: "Sektor", to: "/master/sektor" },
      { label: "Assessmen Komponen Rumah", to: "/master/komponen-rumah" },
    ],
  },
  {
    label: "Assessmen",
    icon: RiSurveyLine,
    roles: ["admin"],
    administratorOnly: true,
    children: [
      { label: "Penilaian Kerugian", to: "/assessment/loss" },
      { label: "Kerusakan Rumah", to: "/assessment/house-damage" },
    ],
  },
  {
    label: "Survey",
    to: "/survey",
    icon: RiSurveyFill,
    roles: ["surveyor", "admin"],
  },
  {
    label: "User",
    icon: RiTeamLine,
    roles: ["admin"],
    children: [
      {
        label: "Admin Monitoring",
        to: "/user/admins",
        administratorOnly: true,
      },
      { label: "Surveyor", to: "/user/surveyors" },
    ],
  },
  {
    label: "Complain",
    to: "/complain",
    icon: RiEmotionUnhappyLine,
    roles: ["surveyor"],
  },
  {
    label: "Profil",
    to: "/profile",
    icon: RiUserLine,
    roles: ["admin", "surveyor"],
  },
];

// Menu for one account: filtered by role, and for Monitoring also by administratorOnly (empty groups are dropped).
export function navFor(role: Role | null, monitoring: boolean): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(
    (item) =>
      item.roles.includes(role) && !(monitoring && item.administratorOnly),
  )
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter(
              (child) => !(monitoring && child.administratorOnly),
            ),
          }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  surveyor: "Surveyor",
};
