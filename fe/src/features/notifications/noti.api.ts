import api from '../../api/client'
import type { Notification } from './type';

export const notificationsAPI = {
    getUserNoti:() =>
        api.get<Notification[]>('/notifications'),
    markRead:(notiId:string) =>
        api.patch(`/notifications/mark-read/${notiId}`),
    deleteNoti:(notiId:string) =>
        api.delete(`/notifications/delete/${notiId}`),
    clearAllNotifications:() =>
        api.delete('/notifications/clear-all')
}