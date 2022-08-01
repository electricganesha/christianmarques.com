import styles from "../../styles/Photo.module.scss";
import Slider from "react-slick";
import {format} from "date-fns";
import {useRouter} from "next/router";
import Loader from "../../components/Loader/Loader";
import Image from "next/image";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../utils/cloudinary";

export default function Projects(props) {
  const router = useRouter();
  const photos = props.photos;

  if (router.isFallback) {
    return <Loader />;
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true
  };

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Christian Marques - Photography"
        description="A selection of Christian Marques' photos from around the world. Taken with a FUJI X100S, fixed lens, no filters."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623927670/christianmarques.com/website/Screenshot_2021-06-17_at_11.32.59.png"
        url="https://christianmarques.com/photo/"
        type={"article"}
      />
      <Slider {...settings}>
        {photos.map((photo, index) =>
          <div className={styles.photo} key={index}>
            <Image
              placeholder="blur"
              blurDataURL={convertToCloudinaryBlurURL(photo.link)}
              width={768}
              height={512}
              alt={photo.title}
              src={cleanUpCloudinaryURL(photo.link)}
            />
            <p>{`${photo.title}, ${photo.location}`}</p>
            <p>
              {format(new Date(photo.date._seconds * 1000), "MMM yyyy")}
            </p>
          </div>
        )}
      </Slider>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("http://localhost:3000/api/photos");
  const photos = await res.json();
  return {
    props: {photos}
  };
};
