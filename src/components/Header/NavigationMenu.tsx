"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { IoIosArrowDown } from "react-icons/io";

interface MenuItem {
  href: string;
  label: string;
}

interface NavigationMenuProps {
  menuItems: MenuItem[];
  allowedUrls: string[];
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  menuItems,
  allowedUrls,
}) => {
  const [moreItems, setMoreItems] = useState<string[]>([]);
  const [showMoreItems, setShowMoreItems] = useState(false);
  const navRef = useRef<HTMLUListElement>(null);
  const moreItemsContainerRef = useRef<HTMLLIElement>(null);

  const isValidUrl = (url: string) => allowedUrls.includes(url);

  const handleResize = useCallback(() => {
    if (!navRef.current) return;
    const navWidth = navRef.current.offsetWidth;
    const children = Array.from(navRef.current.children) as HTMLLIElement[];
    const moreButtonEl = children.find(
      (child) => child.dataset.moreButton === "true"
    );
    const moreButtonWidth = moreButtonEl ? moreButtonEl.offsetWidth : 0;
    const menuItemElements = children.filter(
      (child) => child.dataset.moreButton !== "true"
    );
    const widths = menuItemElements.map((child) => child.offsetWidth);

    let totalWidth = widths.reduce((acc, w) => acc + w, 0);
    let visibleCount = menuItems.length;
    const moreItemsLabels: string[] = [];

    if (totalWidth > navWidth) {
      totalWidth += moreButtonWidth;
    }

    while (totalWidth > navWidth && visibleCount > 0) {
      visibleCount--;
      totalWidth -= widths[visibleCount];
      moreItemsLabels.push(menuItems[visibleCount].label);
      if (moreItemsLabels.length === 1) {
        totalWidth += moreButtonWidth;
      }
    }
    setMoreItems(moreItemsLabels);
  }, [menuItems]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreItemsContainerRef.current &&
        !moreItemsContainerRef.current.contains(event.target as Node)
      ) {
        setShowMoreItems(false);
      }
    };
    if (showMoreItems) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreItems]);

  return (
    <nav className="w-full bg-white flex justify-around p-2">
      <ul ref={navRef} className="flex justify-around items-center w-full">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={moreItems.includes(item.label) ? "hidden" : "block"}
          >
            {isValidUrl(item.href) && (
              <Link
                prefetch
                href={item.href}
                className="px-6 py-2 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
        {moreItems.length > 0 && (
          <li
            ref={moreItemsContainerRef}
            data-more-button="true"
            className="relative"
          >
            <div
              onClick={() => setShowMoreItems(!showMoreItems)}
              className="px-6 py-2 cursor-pointer hover:underline flex items-center"
            >
              Mais <IoIosArrowDown />
            </div>
            {showMoreItems && moreItems.length > 0 && (
              <ul className="absolute min-w-[200px] right-0 bg-white shadow-md border border-gray-300 mt-2">
                {moreItems
                  .slice()
                  .reverse()
                  .map((label, index) => {
                    const item = menuItems.find(
                      (menuItem) => menuItem.label === label
                    );
                    if (!item || !isValidUrl(item.href)) return null;
                    return (
                      <li key={index}>
                        <Link
                          prefetch
                          href={item.href}
                          onClick={() => setShowMoreItems(false)}
                          className="block px-6 py-2 w-full hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
};

export default NavigationMenu;
