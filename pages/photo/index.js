import styles from "../../styles/Photo.module.scss";
import Slider from "react-slick";
import { format } from "date-fns";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";

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
    adaptiveHeight: true,
  };

  return (
    <div className={styles.container}>
        <Slider {...settings}>
          {photos.map((photo, index) => (
            <div className={styles.photo} key={index}>
              <img src={photo.link} />
              <p>{`${photo.title}, ${photo.location}`}</p>
              <p>{format(new Date(photo.date._seconds * 1000), "MMM yyyy")}</p>
            </div>
          ))}
        </Slider>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("http://localhost:3000/api/photos");
  const photos = await res.json();
  return {
    props: { photos },
  };
};
