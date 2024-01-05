import { format } from "date-fns";
import Link from "next/link";
import React from "react";
import styles from "./BlogCard.module.scss";

const BlogCard = ({ post: blogItem }) => {
  const thumbnail = blogItem.content.split('src="')[1].split('"')[0];

  return (
    <div className={styles.blogCard}>
      <Link href={blogItem.link}>
        <a>
          <div className={styles.blogCard__text}>
            <p>{blogItem.title}</p>
            <img
              className={styles.blogCard__image}
              src={thumbnail}
              width={480}
              height={240}
            />
            <p className={styles.blogCard__date}>
              Published on <a href="https://medium.com/">Medium</a> on{" "}
              {format(new Date(blogItem.pubDate), "PPP")}
            </p>
          </div>
        </a>
      </Link>
    </div>
  );
};

export default BlogCard;
