// app/IDE/page.jsx
"use client";
import { Provider } from "react-redux";
import IDE from "../components/IDE";
import store from '../../store';
import SideBar from "../components/SideBar";

function IDEPage() {
  return(
    <Provider store={store}>
    <section className="flex flex-row">
      <SideBar currentPage="codeground"/>
      <IDE />
    </section>
    </Provider>
  );
}

export default IDEPage;
