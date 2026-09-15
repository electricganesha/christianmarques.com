import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import styles from "./BlogCard.module.scss";
import { formatTag } from "../../utils/tagFormatter";

const BLOG_IMAGE_MAP = {
  "dwarf-fortress": "/images/blog/dwarf-fortress.jpg",
  "navigating-the-chaos": "/images/blog/iching-compass.jpg",
  "3-000-year-old-compass": "/images/blog/iching-compass.jpg",
  "timewave-zero": "/images/blog/timewave-zero.jpg",
  "ghost-in-the-mandelbrot": "/images/blog/mandelbrot.png",
  "mandelbrot": "/images/blog/mandelbrot.png",
  "8-months-of-monitoring": "/images/blog/hamster-8-months.jpg",
  "ultimate-hamster": "/images/blog/hamster-ultimate.png",
  "optimal-route-crafting": "/images/blog/mesh-shortest-path.jpg",
  "shortest-path": "/images/blog/mesh-shortest-path.jpg",
  "on-boarding-ascent": "/images/blog/onboarding-ascent.jpg",
  "onboarding-ascent": "/images/blog/onboarding-ascent.jpg",
  "finding-peace-in-the-silence": "/images/blog/zen-ghosting.jpg",
  "zen-approach": "/images/blog/zen-ghosting.jpg",
};

export function getBlogImage(blogItem) {
  if (!blogItem) return "/images/blog/dwarf-fortress.jpg";
  const link = (blogItem.link || blogItem.guid || "").toLowerCase();
  const title = (blogItem.title || "").toLowerCase();

  for (const [key, localPath] of Object.entries(BLOG_IMAGE_MAP)) {
    if (link.includes(key) || title.includes(key.replace(/-/g, " "))) {
      return localPath;
    }
  }

  const match = blogItem?.content?.match(/src="([^">]+)"/);
  return (
    blogItem?.thumbnail ||
    (match ? match[1] : null) ||
    "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776904/christianmarques.com/website/blog.png"
  );
}

const BlogCard = ({ post: blogItem, index, reversed }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbnail = getBlogImage(blogItem);
  const title = (blogItem?.title || "").replace(/Ressurection/g, "Resurrection");
  const isPriority = index === 0;

  return (
    <Link
      href={blogItem.link}
      className={styles.blogCardLargeLink}
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
                <div
                  className={`${styles.imagePlaceholder} ${
                    isLoaded ? styles.imagePlaceholderHidden : ""
                  }`}
                  aria-hidden="true"
                />
                <Image
                  src={thumbnail}
                  alt={title}
                  layout="fill"
                  objectFit="cover"
                  priority={isPriority}
                  loading={isPriority ? "eager" : "lazy"}
                  loader={thumbnail.startsWith("/") ? ({ src }) => src : undefined}
                  unoptimized={thumbnail.startsWith("/")}
                  className={`${styles.blogCardLargeImg} ${
                    isPriority ? styles.blogCardLargeImgPriority : ""
                  } ${isLoaded ? styles.blogCardLargeImgLoaded : ""}`}
                  onLoad={() => setIsLoaded(true)}
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
            <h2 className={styles.blogCardLargeTitle}>{title}</h2>
          </div>
        
          <div
            className={
              styles.blogCardLargeTags +
              (reversed ? " " + styles.reversed : "")
            }
          >
            {blogItem.categories && blogItem.categories.length > 0 && blogItem.categories.map((tag) => (
              <span key={tag} className={styles.blogCardLargeTag}>
                {formatTag(tag)}
              </span>
            ))}
          </div>
          <div className={styles.blogCardLargeDate}>
            <span>
              Published on Medium on {format(new Date(blogItem.pubDate), "PPP")}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
