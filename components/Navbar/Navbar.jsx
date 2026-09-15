import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { slide as Menu } from "react-burger-menu";
import styles from "./Navbar.module.scss";

const MenuIconClosed = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={styles.menuIconSvg}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const MenuIconOpen = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={styles.menuIconSvg}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
  { href: "/blog", label: "Blog" },
  { href: "/lab", label: "Lab" },
  { href: "/music", label: "Music" },
  { href: "/photo", label: "Photo" },
  { href: "/press", label: "Press" },
  { href: "/about", label: "About" },
];

const Navbar = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);

    const handleRouteChange = () => {
      setIsMenuOpen(false);
      window.scrollTo(0, 0);
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  const renderNavLinks = (isMobileView = false) => (
    <ul className={isMobileView ? styles.mobileNavList : styles.desktopNavList}>
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? router.pathname === "/"
            : router.pathname === item.href ||
              router.pathname.startsWith(item.href + "/");

        return (
          <li
            key={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
          >
            <Link href={item.href} passHref legacyBehavior>
              <a
                onClick={closeMenu}
                aria-current={isActive ? "page" : undefined}
                className={styles.navLink}
              >
                {item.label}
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <header className={styles.navBar} role="banner">
      <nav aria-label="Main Navigation" className={styles.navContainer}>
        <button
          className={styles.mobileButton}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <MenuIconOpen /> : <MenuIconClosed />}
        </button>

        {renderNavLinks(false)}

        <Menu
          isOpen={isMenuOpen}
          onClose={closeMenu}
          customBurgerIcon={false}
          customCrossIcon={false}
        >
          {renderNavLinks(true)}
        </Menu>
      </nav>
    </header>
  );
};

export default Navbar;
