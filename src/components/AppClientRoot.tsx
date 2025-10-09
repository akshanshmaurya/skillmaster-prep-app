"use client";

import RouteTransition from "@/components/RouteTransition";
import { PropsWithChildren } from "react";

export default function AppClientRoot({ children }: PropsWithChildren) {
  return <RouteTransition>{children}</RouteTransition>;
}


