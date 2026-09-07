"use client";

import { useParams } from "next/navigation";
import { PublicFormRunner } from "../../../components/public/PublicFormRunner";

export default function PublicFormRunnerFormRoutePage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  return <PublicFormRunner slug={slug} />;
}
