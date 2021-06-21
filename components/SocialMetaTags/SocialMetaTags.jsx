import Head from 'next/head';

const SocialMetaTags = ({name, description, image, url, type}) => {
    return <Head>
    <link rel="canonical" href={url} />
    <meta property="og:title" content={name} key="og:title" />
    <meta property="og:description" content={description} key="og:description" />
    <meta property="og:image" content={image} key="og:image" />
    <meta property="og:url" content={url} key="og:url" />
    <meta property="og:type" content={type} key="og:type" />
    <meta name="twitter:card" content="summary"/>
    <meta name="twitter:url" content={url}/>
    <meta name="twitter:title" content={name}/>
    <meta name="twitter:description" content={description}/>
    <meta name="twitter:image" content={image}/>
  </Head>;
};

export default SocialMetaTags;
