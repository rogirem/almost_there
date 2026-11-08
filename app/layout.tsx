import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Почти рядом · Питер FM',description:'Прогулка для двоих по Коломне: SMS из 2006 года, фото, музыка и встреча в конце.',icons:{icon:'/favicon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,interactiveWidget:'resizes-content'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
