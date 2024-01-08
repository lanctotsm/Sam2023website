import AboutMe from "./pages/AboutMe";
import Gallery from "./pages/Gallery";

const routes = [
  {
    path: "/",
    component: <AboutMe/>,
    exact: true
  },
  {
    path: "/gallery",
    component: <Gallery />,
  },
];

export default routes;