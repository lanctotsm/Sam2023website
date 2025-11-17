import { ReactElement } from "react";
import AboutMe from "./pages/AboutMe";
import AlbumsPage from "./pages/Albums";
import AlbumDetailsPage from "./pages/AlbumDetails";
import LoginPage from "./pages/Login";
import NotFoundPage from "./pages/NotFound";
import ResumePage from "./pages/ResumePage";
import UploadPage from "./pages/Upload";
import ProtectedRoute from "./components/routing/ProtectedRoute";

interface RouteConfig {
  path: string;
  element: ReactElement;
}

const protectedFallback = (
  <NotFoundPage
    title="Upload not available"
    message="You must be signed in to upload photos."
  />
);

const routes: RouteConfig[] = [
  { path: "/", element: <AboutMe /> },
  { path: "/albums", element: <AlbumsPage /> },
  { path: "/gallery", element: <AlbumsPage /> },
  { path: "/Gallery", element: <AlbumsPage /> },
  { path: "/albums/:albumId", element: <AlbumDetailsPage /> },
  { path: "/upload", element: (
    <ProtectedRoute fallback={protectedFallback}>
      <UploadPage />
    </ProtectedRoute>
  ) },
  { path: "/resume", element: <ResumePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> },
];

export default routes;