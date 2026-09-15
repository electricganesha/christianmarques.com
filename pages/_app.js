import { Fragment } from "react";
import "../styles/globals.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Head from "next/head";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import GoogleAnalyticsTag from "../components/GoogleAnalyticsTag/GoogleAnalyticsTag";

function MyApp({ Component, pageProps }) {
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
      <GoogleAnalyticsTag />
    </Fragment>
  );
}

export default MyApp;
