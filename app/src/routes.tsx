import AboutMe from "./pages/AboutMe";
import Gallery from "./pages/Gallery";
import ResumePage from "./pages/ResumePage";
import Login from "./pages/Login";
import Albums from "./pages/Albums";
import AlbumDetail from "./pages/AlbumDetail";
import Upload from "./pages/Upload";
import ManageAlbums from "./pages/ManageAlbums";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const routes = [
  {
    path: "/",
    component: <AboutMe/>,
    exact: true
  },
  {
    path: "/Gallery",
    component: <Gallery />,
  },
  {
    path: "/Resume",
    component: <ResumePage/>
  },
  {
    path: "/login",
    component: <Login />
  },
  {
    path: "/albums",
    component: <Albums />
  },
  {
    path: "/albums/:albumId",
    component: <AlbumDetail />
  },
  {
    path: "/upload",
    component: <ProtectedRoute><Upload /></ProtectedRoute>
  },
  {
    path: "/manage-albums",
    component: <ProtectedRoute><ManageAlbums /></ProtectedRoute>
  },
  {
    path: "/404",
    component: <NotFound />
  },
  {
    path: "*",
    component: <NotFound />
  }
];

export default routes;