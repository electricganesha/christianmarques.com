import Head from 'next/head';

const GoogleAnalyticsTag = () => {
    const script = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);};
    gtag('js', new Date());

    gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
`;

    return <Head>
        <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
        />
        <script
            id="gtag-init"
            async
            dangerouslySetInnerHTML={{
                __html: script,
            }}
        />
    </Head>;
};

export default GoogleAnalyticsTag;
