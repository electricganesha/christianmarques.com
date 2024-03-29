import { Fragment } from 'react';
import "../styles/globals.scss";
import "../node_modules/slick-carousel/slick/slick.css";
import "../node_modules/slick-carousel/slick/slick-theme.css";
import Head from "next/head";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import FirebaseTag from "../components/FirebaseTag/FirebaseTag";
import GoogleAnalyticsTag from "../components/GoogleAnalyticsTag/GoogleAnalyticsTag";
import SocialMetaTags from "../components/SocialMetaTags/SocialMetaTags";

function MyApp({Component, pageProps}) {
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
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora&family=Roboto:wght@100;400;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://www.gstatic.com/firebasejs/8.6.7/firebase-app.js"></script>
        <script src="https://www.gstatic.com/firebasejs/8.6.7/firebase-analytics.js"></script>
      </Head>
      <Navbar />
      <main className="main">
        <Component {...pageProps} />
      </main>
      <Footer />
      <GoogleAnalyticsTag />
      <FirebaseTag />
    </Fragment>
  );
}

export default MyApp;
