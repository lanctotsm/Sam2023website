import AboutMe from "./pages/AboutMe";
import Gallery from "./pages/Gallery";
import ResumePage from "./pages/ResumePage";

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
    component:<ResumePage/>
  }
];

export default routes;