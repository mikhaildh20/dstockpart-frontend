import { useState, useCallback, useEffect } from "react";
import Input from "@/component/common/Input";
import Button from "@/component/common/Button";
import { useRouter, useParams } from "next/navigation";
import fetchData from "@/lib/fetch";
import Toast from "@/component/common/Toast";
import Breadcrumb from "@/component/common/Breadcrumb";
import { decryptIdUrl } from "@/lib/encryptor";

export default function DetailLinePage(){
    const path = useParams();
    const router = useRouter();
    const id = decryptIdUrl(path.id);
    
}