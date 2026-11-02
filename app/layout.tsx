import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Почти рядом · Питер FM',description:'Один город. Два человека. Сообщение, которое всё-таки дошло.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
