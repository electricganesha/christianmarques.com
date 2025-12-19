import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import styles from "./BlogCard.module.scss";

const BlogCard = ({ post: blogItem, index, reversed }) => {
  const thumbnail = blogItem.content.split('src="')[1].split('"')[0];

  return (
    <Link
      href={blogItem.link}
      className={styles.blogCardLargeLink}
      style={{ animationDelay: `${index ? index * 0.15 : 0}s` }}
      target="_blank"
      rel="noopener noreferrer"
    >
      <article
        className={
          styles.blogCardLargeArticle +
          (reversed ? " " + styles.reversed : "")
        }
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <div
          className={
            styles.blogCardLargeImageCol +
            (reversed ? " " + styles.reversed : "")
          }
        >
          <div className={styles.blogCardLargeImageWrapper}>
            <div className={styles.blogCardLargeImage}>
              <div className={styles.blogCardLargeImageInner}>
                <Image
                  src={thumbnail}
                  alt={blogItem.title}
                  layout="fill"
                  className={styles.blogCardLargeImg}
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
                <div className={styles.blogCardLargeOverlay}>
                  <div className={styles.blogCardLargeOverlayContent}>
                    <div className={styles.blogCardLargeOverlayFlex}>
                      <span className={styles.blogCardLargeOverlayText}>
                        Read Blog
                      </span>
                      <ArrowUpRight className={styles.blogCardLargeOverlayArrow} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            styles.blogCardLargeText +
            (reversed ? " " + styles.reversed : "")
          }
        >
          <div>
            <span className={styles.blogCardLargeCategory}>
              Blog
            </span>
            <h2 className={styles.blogCardLargeTitle}>{blogItem.title}</h2>
          </div>
        
          <div
            className={
              styles.blogCardLargeTags +
              (reversed ? " " + styles.reversed : "")
            }
          >
            {blogItem.categories && blogItem.categories.length > 0 && blogItem.categories.map((tag) => (
              <span key={tag} className={styles.blogCardLargeTag}>{tag}</span>
            ))}
          </div>
          <div className={styles.blogCardLargeDate}>
            <span>
              Published on <a href="https://medium.com/" target="_blank" rel="noopener noreferrer">Medium</a> on {format(new Date(blogItem.pubDate), "PPP")}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
