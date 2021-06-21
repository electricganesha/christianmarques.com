import Head from 'next/head';

const FirebaseTag = () => {
    const script = `
    var firebaseConfig = {
        apiKey: "AIzaSyCjAlrHNFXhazEu_vR9jExoBS7tUROob6E",
        authDomain: "christianmarques-c2f93.firebaseapp.com",
        databaseURL: "https://christianmarques-c2f93.firebaseio.com",
        projectId: "christianmarques-c2f93",
        storageBucket: "christianmarques-c2f93.appspot.com",
        messagingSenderId: "1018634230837",
        appId: "1:1018634230837:web:6a9a52274d1d69d049257c",
        measurementId: "G-NYL87ZTZR8"
      };

      firebase.initializeApp(firebaseConfig);
      firebase.analytics();
`;

    return <Head>
        <script
            key="script/firebase"
            dangerouslySetInnerHTML={{__html: script}}
        />
    </Head>;
};

export default FirebaseTag;
