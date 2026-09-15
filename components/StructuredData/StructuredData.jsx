import React from "react";
import Head from "next/head";

export default function StructuredData({ data }) {
  if (!data) return null;

  const dataArray = Array.isArray(data) ? data : [data];

  return (
    <Head>
      {dataArray.map((schema, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
