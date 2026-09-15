import { Fragment, useState, useEffect } from "react";
import Router from "next/router";
import "../styles/globals.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Head from "next/head";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import GoogleAnalyticsTag from "../components/GoogleAnalyticsTag/GoogleAnalyticsTag";
import WebGLTransition from "../components/PageTransition/WebGLTransition";

function MyApp({ Component, pageProps }) {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleStart = (url) => {
      const currentPath = (Router.asPath || "").split("#")[0];
      const targetPath = (url || "").split("#")[0];
      if (currentPath !== targetPath) {
        setIsNavigating(true);
      }
    };
    const handleComplete = () => {
      setIsNavigating(false);
    };

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  const title = `Christian Marques . ${new Date().getFullYear()}`;
  const description =
    "Christian Marques - software engineer - official website.";
  return (
    <Fragment>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} key="description" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="developer, software engineer, music, poetry, writing, photography, software, engineering, virtual reality, videogames"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main className="main" id="main-content">
        <Component {...pageProps} />
      </main>
      <Footer />
      <WebGLTransition />
      <GoogleAnalyticsTag />
    </Fragment>
  );
}

export default MyApp;
