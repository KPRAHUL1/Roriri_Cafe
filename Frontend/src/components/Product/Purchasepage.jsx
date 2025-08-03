import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ShoppingView from "./ShopifyInfo";

const PurchasePage = () => {
  const location = useLocation();
  const initialUser = location.state?.user;

  const [userData, setUserData] = useState(initialUser || null);

  useEffect(() => {
    if (!initialUser) {
      console.warn("No user passed via location.state");
    }
  }, [initialUser]);

  return (
    <ShoppingView
      userData={userData}
      setUserData={setUserData}
      onBackToUser={() => window.history.back()}
    />
  );
};

export default PurchasePage;
