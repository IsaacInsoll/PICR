import {Text} from 'react-native'
import {useMe} from "@/src/hooks/useMe";
import {Redirect} from "expo-router";
export default function index() {
    const me = useMe();
    console.log(me?'Logged In':'Not Logged In');
    if(!me) return <Redirect href="/login" />;
    return <Text>this is index</Text>
}