"use server"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"

const faqData = [
  {
    question: "What is the NGDI Portal?",
    answer:
      "The National Geospatial Data Infrastructure (NGDI) Portal is a centralized platform for discovering, accessing, and utilizing geospatial data from various contributors across the nation. It aims to foster innovation and informed decision-making."
  },
  {
    question: "Who can use the NGDI Portal?",
    answer:
      "The portal is designed for a wide range of users, including government agencies, private sector companies, academic institutions, researchers, and the general public interested in geospatial data."
  },
  {
    question: "How do I find data on the portal?",
    answer:
      "You can use our advanced search functionality to query metadata records based on keywords, location, time period, data themes, and other criteria. You can also browse data by categories or contributing organizations."
  },
  {
    question: "What types of data are available?",
    answer:
      "The portal provides access to a diverse range of geospatial data, including satellite imagery, aerial photography, topographic maps, demographic data, environmental data, infrastructure data, and much more. Data availability depends on contributions from various organizations."
  },
  {
    question: "Is there a cost to use the portal or access data?",
    answer:
      "Access to the portal itself and much of the metadata is generally free. Some specific datasets or premium services offered by data providers might have associated costs or licensing terms. Please check the details for each dataset."
  },
  {
    question: "How can my organization contribute data to the portal?",
    answer:
      "Organizations interested in contributing data can register as a data provider. The portal provides tools and guidelines for publishing metadata and making data accessible. Please contact our support team for more information on becoming a contributor."
  },
  {
    question: "What metadata standards are used?",
    answer:
      "The NGDI Portal primarily adheres to [mention specific national/international standards, e.g., ISO 19115/19139, FGDC CSDGM] to ensure interoperability and consistency of metadata records. We provide tools to help transform metadata to compliant formats."
  },
  {
    question: "How is data quality ensured?",
    answer:
      "While the NGDI Portal facilitates access to data, the primary responsibility for data quality rests with the contributing organizations. However, we encourage best practices in metadata documentation, provide validation tools where possible, and allow users to provide feedback on data quality."
  }
]

export default async function FaqPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Find answers to common questions about the NGDI Portal, its
            features, and how to use it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
