'use client'

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart, FaTimes } from "react-icons/fa";
import { Button, Spinner } from "@nextui-org/react";
import { getCookies } from "@/utils/firebase";
import { collection, and, query, where, or, getDocs, doc, getDoc, addDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import { db, storage } from "@/firebase/config";
import PropertyCard from "@/components/property/PropertyCard";
import { toast } from "react-toastify";
import moment from "moment";
import Link from 'next/link';

export default function PropertySwiper() {
  const [stack, setStack] = useState<Property[]>([]);
  const [liked, setLiked] = useState<Property[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [showHeart, setShowHeart] = useState(false);


  const getNewProperty = async () => {
    setIsLoading(true)
    const tempData: any = [];

    const preferences = await getUserPreferences();

    const docRef = collection(db, "properties");
    const q = query(docRef, and(
      preferences.type != "all" ? where("type", "==", preferences.type) : where('type', 'in', ['buy', 'rent', 'new_launches']),
      and(
        where('isBought', '==', false),
        and(
          where('bedroom', '>=', 0),
          and(
            and(
              where('price', '>=', preferences.priceRange[0]),
              where('price', '<=', preferences.priceRange[1]),
            ),
            and(
              where('size', '>=', preferences.houseArea[0]),
              where('size', '<=', preferences.houseArea[1]),
            ),
          ),
        )
      )));
    let querySnapshot = await getDocs(q);
    const userFavourites = await getUserFavourites() || []

    const filteredQuerySnapshot = querySnapshot.docs.filter((doc) => {
      for (const propertyID of userFavourites) {
        if (propertyID == doc.id) {
          return false
        }
      }
      return true
    })

    const filteredData = filteredQuerySnapshot.map((doc) => {
      return { ...doc.data(), id: doc.id };
    })

    const searchResults = filteredData.filter((item: any) => {
      return preferences.location.toLowerCase() === ''
        ? item
        : item.name.toLowerCase().includes(preferences.location.toLowerCase())
        || item.address.toLowerCase().includes(preferences.location.toLowerCase())
    })

    const fetchPromises = searchResults.map(async (docz: any) => {
      const storageRef = ref(storage, `properties/${docz.id}`);
      const images = await listAll(storageRef)
      const tempImages: any[] = []
      const tempImage = await getDownloadURL(images.items[0])
      tempImages.push(tempImage)
      // const imagesFetching = images.items.map(async imageRef => {
      // })
      const listerRef = doc(db, 'users', docz.owner)
      const lister = await getDoc(listerRef)
      let listerData = {}
      if (lister.exists()) {
        listerData = { id: lister.id, ...lister.data() }
      }
      // await Promise.all(imagesFetching)
      tempData.push({ id: docz.id, ...docz, images: tempImages, lister: listerData });
    });
    await Promise.all(fetchPromises)
    setProperties(tempData);
    setStack(tempData)
    setIsLoading(false);
  };

  const getUserFavourites = async () => {
    const { id: userID } = await getCookies()
    const collectionRef = collection(db, 'users', userID, 'favourites');
    try {
      const res = await getDocs(collectionRef)
      const favourites = res.docs.map((doc) => doc.data().propertyID)
      return favourites
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const getUserPreferences = async () => {
    const { id: userID } = await getCookies()
    const docRef = doc(db, 'users', userID,);
    try {
      const res = await getDoc(docRef)
      const preferences = res.data()?.preferences || { location: "", priceRange: [0, 2000000], houseArea: [0, 3000], type: 'all' }
      return preferences
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  useEffect(() => {
    getNewProperty();
  }, []);


  const handleSwipe = (dir: "left" | "right") => {
    if (!showHeart && stack.length > 0) {
      setSwipeDirection(dir)
      const current = stack[0];
      if (dir === "right") {
        setLiked([...liked, current]);
        onLikeHandler(current.id, current.name)
        setShowHeart(true)
        setTimeout(() => setStack((prev) => prev.slice(1)), 600);
      } else {
        setStack((prev) => prev.slice(1))
      }
    }
  };

  useEffect(() => {
    console.log(showHeart)
    if (showHeart) {
      setTimeout(() => setShowHeart(false), 500);
    }
  }, [showHeart])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") handleSwipe("left");
    if (e.key === "ArrowRight") handleSwipe("right");
  };

  const onLikeHandler = async (propertyID: string, propertyName: string) => {
    const { id: userID } = await getCookies()
    const docRef = doc(db, 'users', userID, 'favourites', propertyID);
    try {
      await setDoc(docRef, {
        propertyID: propertyID,
        timeCreated: moment().format(),
      })
      toast.success(`Added property '${propertyName}' to favourites!`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }


  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stack]);


  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner label="Loading..." color="warning" />
      </div>
    )

  return (
    <div className="container mx-auto flex flex-col items-center h-[800px] py-4">
      <h1 className="text-2xl font-bold mb-6">Properties Explorer</h1>

      <div className="relative w-[400px] max-w-lg h-[450px]">
        <AnimatePresence>
          {stack.map((listing, i) => {
            const isTop = i === 0;
            return (
              <motion.div
                key={listing.id}
                initial={{ scale: 0.8, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1, zIndex: stack.length - i }}
                className="absolute w-full h-full flex items-center justify-center bg-white rounded-2xl shadow-xl"
                exit={{ x: -100, y: -100, opacity: 0, scale: 1, rotate: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* <img src={listing.images[0]} alt={listing.name} className="w-full h-64 object-cover" />
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{listing.name}</h2>
                  <p className="text-gray-600">RM {listing.price}</p>
                </div> */}
                <PropertyCard property={listing} index={i} canChat={false} />
              </motion.div>
            );
          })}
          {showHeart && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute top-1/3 left-1/3 text-red-500 z-20"
            >
              <FaHeart size={140} />
            </motion.div>
          )}
        </AnimatePresence>
        {stack.length == 0 && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="mx-auto w-[300px] flex flex-col items-center gap-2">
            <Link scroll={true} href={`/settings`}>
              <Button color="secondary">
                Go to Favourites ❤️
              </Button>
            </Link>
            {/* <Button color="secondary" onClick={() => setStack(properties)}>
              restart (for testing)
            </Button> */}
          </div>
          <div className="text-center mt-8">
            <h2 className="text-lg mb-4 opacity-80">You're all caught up! <br /> 👍🤩</h2>
            {/* <p>Liked properties: {liked.length}</p> */}
          </div>
        </div>)}
      </div>

      {stack.length > 0 && (
        <div className="flex justify-around mt-6 w-full max-w-md">
          <button
            onClick={() => handleSwipe("left")}
            className="bg-red-100 text-red-600 p-3 rounded-full hover:bg-red-200"
          >
            <FaTimes size={40} />
          </button>
          <button
            onClick={() => handleSwipe("right")}
            className="bg-green-100 text-green-600 p-3 rounded-full hover:bg-green-200"
          >
            <FaHeart size={40} />
          </button>
        </div>
      )}
    </div>
  );
}
