import React, {useState, useCallback, useEffect} from "react";
import styles from "./Navbar.module.scss";
import Link from "next/link";
import {slide as Menu} from "react-burger-menu";
import {useRouter} from "next/router";

const MenuIconClosed = isMenuOpen =>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    style={{
      display: isMenuOpen ? "block" : "none",
      zIndex: isMenuOpen ? "999" : "-1"
    }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>;

const MenuIconOpen = () =>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>;

const Navbar = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(
    () => {
      setIsMenuOpen(!isMenuOpen);
    },
    [isMenuOpen, setIsMenuOpen]
  );

  useEffect(() => {
    setIsMenuOpen(false);

    const handleRouteChange = () => {
      setIsMenuOpen(false);
      document.body.scrollTop = 0;
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, []);

  const navbarList = (
    <ul>
      <MenuIconOpen className={styles.mobileButton} onClick={toggleMenu} />
      <li>
        <Link href="/">
          <a>Home</a>
        </Link>
      </li>
      <li>
        <Link href="/projects">
          <a>Projects</a>
        </Link>
      </li>
      <li>
        <Link href="/writing">
          <a>Writing</a>
        </Link>
      </li>
      <li>
        <Link href="/music">
          <a>Music</a>
        </Link>
      </li>
      <li>
        <Link href="/photo">
          <a>Photo</a>
        </Link>
      </li>
      <li>
        <Link href="/press">
          <a>Press</a>
        </Link>
      </li>
      <li>
        <Link href="/about">
          <a>About</a>
        </Link>
      </li>
      <li>
        <Link href="/lab">
          <a>Lab</a>
        </Link>
      </li>
      <li>
        <Link href="https://hypseus.vercel.app">
          <a>Hypseus</a>
        </Link>
      </li>
    </ul>
  );

  return (
    <div className={styles.navBar}>
      <button className={styles.mobileButton} onClick={toggleMenu}>
        <MenuIconClosed />
      </button>
      {navbarList}
      <Menu isOpen={isMenuOpen} onClose={toggleMenu}>
        {navbarList}
      </Menu>
    </div>
  );
};

export default Navbar;
