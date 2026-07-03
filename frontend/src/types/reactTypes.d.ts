import { ElementType } from "react";
import { IconType } from "react-icons";

export type IconName =
  | "home"
  | "briefcase"
  | "queue"
  | "users"
  | "userPlus"
  | "chart"
  | "settings"
  | "doc"
  | "login"
  | "shield"
  | "wrench"
  | "userGroup";

export type NavlinkItem = {
  name: string;
  href: string;
  icon: IconName;
};

