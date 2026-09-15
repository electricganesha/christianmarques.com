import styles from "../../styles/Photo.module.scss";
import Slider from "react-slick";
import { format } from "date-fns";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";
import Image from "next/image";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL,
} from "../../utils/cloudinary";

export default function Projects(props) {
  const router = useRouter();
  const photos = props.photos || [];

  if (router.isFallback) {
    return <Loader />;
  }

  const handleAfterChange = () => {
    if (typeof document !== "undefined") {
      const activeDot = document.querySelector(
        `.${styles.sliderWrapper} .slick-dots .slick-active`
      );
      if (activeDot && typeof activeDot.scrollIntoView === "function") {
        activeDot.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: false,
    afterChange: handleAfterChange,
  };

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Photography — Christian Marques"
        description="Visual journeys and quiet moments from around the world, captured on a Fujifilm X100S with a fixed 23mm lens."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776907/christianmarques.com/website/photo.png"
        url="https://christianmarques.com/photo/"
        type="website"
      />
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Photography</h1>
        <p className={styles.pageSubtitle}>
          Visual journeys and quiet moments from around the world, captured on a Fujifilm X100S
        </p>
      </header>
      <div className={styles.sliderWrapper}>
        <Slider {...settings}>
          {photos.map((photo, index) => (
            <div className={styles.photo} key={photo.link || index}>
              <div className={styles.photoImageWrapper}>
                <Image
                  placeholder="blur"
                  blurDataURL={convertToCloudinaryBlurURL(photo.link)}
                  width={768}
                  height={512}
                  alt={photo.title}
                  src={cleanUpCloudinaryURL(photo.link)}
                  layout="responsive"
                  priority={index === 0}
                />
              </div>
              <p className={styles.photoCaption}>{`${photo.title}, ${photo.location}`}</p>
              <p className={styles.photoDate}>
                {photo.date?._seconds
                  ? format(new Date(photo.date._seconds * 1000), "MMM yyyy")
                  : ""}
              </p>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("https://christianmarques-com.vercel.app/api/photos");
  const photos = await res.json();
  return {
    props: { photos },
  };
};
