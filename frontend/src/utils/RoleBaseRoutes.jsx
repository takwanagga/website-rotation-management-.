import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router";

const RoleBaseRoutes = ({children, requiredRole}) => {
    const {user, loading} = useAuth()

    if (loading){
        return <div>Loading ...</div>
  }

    if(!requiredRole.includes(user?.role)){
        return <Navigate to="/unauthorized"/>
  }

    return user ? children : <Navigate to="/login"/>

}

export default RoleBaseRoutes