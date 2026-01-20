import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import AppShell from "./AppShell";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const VulnerabilitiesPage = lazy(() => import("@/features/vulnerabilities/VulnerabilitiesPage"));
const VulnDetailPage = lazy(() => import("@/features/vulnerabilities/VulnDetailPage"));
const ComparePage = lazy(() => import("@/features/vulnerabilities/ComparePage"));

const PageLoader = () => <div className="p-6">Loading…</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        )
      },
      {
        path: "vulnerabilities",
        element: (
          <Suspense fallback={<PageLoader />}>
            <VulnerabilitiesPage />
          </Suspense>
        )
      },
      {
        path: "vulnerabilities/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <VulnDetailPage />
          </Suspense>
        )
      },
      {
        path: "compare",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ComparePage />
          </Suspense>
        )
      }
    ]
  }
]);
