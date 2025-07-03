import { Card, CardHeader, CardBody, CardFooter, Button } from "@nextui-org/react";
import Link from 'next/link';
import Image from 'next/image';

const PropertyCard = ({property, index, userID, startChat, canChat, className}: any) => {

    return (<Card className="w-full h-full" key={'property' + index}>
        <Link scroll={true} href={`/property/${property.id}`} className="opacity-100 hover:opacity-90 cursor-pointer transition-all duration-200 h-full">
            <CardHeader className="p-0 w-full h-[200px]">
                <Image height={1000} width={1000} src={property.images[0]} alt="" className="object-cover w-full h-full" />
            </CardHeader>
            <hr />
            <CardBody className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-xl">{property.name}</h4>
                <small className="text-default-500">{property.address}</small>
                <h6 className="font-bold text-medium">RM {property.price.toLocaleString()} {property.type == 'rent' && <span>/ mo</span>}</h6>
                <h1 className="my-2">{property.bedroom} 🛏️ · {property.bathroom} 🚿 · {property.size} sqft</h1>
                <div className="flex gap-2 mb-4">
                    <div className="p-2 py-1 rounded-xl bg-secondary-500">
                        <h1 className="text-sm text-white">{property.type == 'buy' ? 'For Sale' : property.type == "rent" ? 'For Rental' : 'Newly Launching'}</h1>
                    </div>
                    <div className="p-2 py-1 rounded-xl bg-secondary-500">
                        <h1 className="text-sm text-white">{property.tenure == 'freehold' ? 'Freehold' : "Leasehold"}</h1>
                    </div>
                </div>
            </CardBody>
        </Link>
        <hr />
        <CardFooter className="py-4 px-4 flex justify-between h-min">
            <div className="space-x-3 flex items-center">
                <Image height={40} width={40} src={property.lister.image} alt="agent-pfp" />
                <h1>
                    Listed by <span className="font-bold">{property.lister.name}</span>
                </h1>
            </div>
            {canChat && <Button variant="bordered" color="secondary" isDisabled={userID == property.lister.id} onClick={() => startChat(property.lister.id, property.lister.name, property.name)}>Chat with Agent</Button>}
        </CardFooter>
    </Card>)
}

export default PropertyCard;