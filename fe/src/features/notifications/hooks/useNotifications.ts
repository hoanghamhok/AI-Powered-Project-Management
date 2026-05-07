import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import { notificationsAPI } from "../noti.api";
import {useAuth} from "../../auth/hooks/useAuth";
import type { Notification } from "../type";
export const useNotifications = () =>{
    const {user} = useAuth();
    const queryClient=useQueryClient();

    const query= useQuery<Notification[]>({
        queryKey:['notifications'],
        queryFn:async()=>{
            const res = await notificationsAPI.getUserNoti();
            return res.data;
        },
        enabled:!!user,
    })

    const markRead = useMutation({
        mutationFn:(notiId:string) =>{ return notificationsAPI.markRead(notiId)},
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:["notifications"]})
        }
    })

    const deleteNotification = useMutation({
        mutationFn:(notiId:string) => {
            return notificationsAPI.deleteNoti(notiId)},
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:["notifications"]})
        }
    })

    const clearAllNotifications = useMutation({
        mutationFn:() => {
            return notificationsAPI.clearAllNotifications()},
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:["notifications"]})
        }
    })

    return {
    ...query,
    markRead,deleteNotification,clearAllNotifications
  };
    
}