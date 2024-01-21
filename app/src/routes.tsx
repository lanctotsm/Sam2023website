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
    path: "/gallery",
    component: <Gallery />,
  },
  {
    path: "/resume",
    component:<ResumePage/>
  }
];

export default routes;