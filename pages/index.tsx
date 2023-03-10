import * as React from 'react'
import {
  Box, Text, Button, VStack, IconButton, Link, Tag, Flex, useToast, Wrap, Spacer, Heading,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useColorModeValue,
  HStack
} from '@chakra-ui/react'
import Header from '@/components/header'
import cookies from 'js-cookie'
import { MdBackupTable, MdPersonOutline } from 'react-icons/md'
import { VscDebugStart } from 'react-icons/vsc'
import { ChapterDisplay } from '@/components/chapterDisplay'
import { SessionContext, SetSessionContext, defaultSessionValue } from '@/lib/contexts'
import { SetLearningSessionContext, defaultLearningSession} from '@/lib/contexts'
import { useRouter } from 'next/router'
import { getAllChapter, bsL, bsD} from '@/lib/utils'
import { Chapter, Word} from '@/lib/types'


const languages = new Map<string, string>([
  ['en', "en-no-json-01"],
  ['uk', "uk-no-json-01"]
])


export default function Home(props: any) {
  const session = React.useContext(SessionContext)
  const setSession = React.useContext(SetSessionContext)
  const setLearningSession = React.useContext(SetLearningSessionContext)
  const router = useRouter()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [nbWords, setNbWords] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [allChapter, setAllChapter] = React.useState<Chapter[]>(props.allChapter)

  React.useEffect(() => {
    // Check if the user is logged in
    // by checking if the cookie is set
    const _user = cookies.get('auth')
    if (_user === undefined) {
      router.push('/signin')
    }
  }, [])

  React.useEffect(() => {
    setIsLoading(true)

    // Add a to the url information about the current language
    const _lang = router.query.lang as string || "en"
    const _table = languages.get(_lang) || "en-no-json-01"

    // fetch the new table of vocabulary
    fetch(`/api/table?lang=${_lang}`)
    .then((res) => {
      if (res.status !== 200) {
        console.error(`Error ${res.status}: ${res.statusText}`)
        // onChangeLanguage()
      }

      return res.json()
    })
    .then((data) => {
      setSession({
        ...session,
        language: _lang,
        airtable: _table,
      })
      setAllChapter(data)
      setIsLoading(false)
    })
  }, [router.query.lang])

  const updateSessionChapter = (ch: Chapter) => {
    // If chapter already loaded, remove it from the list
    if (session.selectedChapter.includes(ch)) {
      setSession({
        ...session,
        selectedChapter: session.selectedChapter.filter((c) => c !== ch),
      })
      setNbWords(nbWords - ch.nbWord)

      // otherwise, add it to the list
    } else {
      setSession({
        ...session,
        selectedChapter: [...session.selectedChapter, ch],
      })
      setNbWords(nbWords + ch.nbWord)
    }
  }

  const uniqueSessionChapter = (ch: Chapter) => {
    setSession({
      ...session,
      selectedChapter: [ch],
    })
    setNbWords(ch.nbWord)
  }


  const startSession = async () => {
    setLearningSession({
      ...defaultLearningSession,
      startDate: new Date(),
      loadedChapter: session.selectedChapter,
      nbUniqueWord: nbWords,
    })
    router.push("/cross")
    onClose()
  }

  const startTableSession = async () => {
    router.push("/table")
    onClose()
  }

  const bg = useColorModeValue('#EFEFEF', 'gray.800')
  const boxShadow = useColorModeValue(bsL, bsD)
  const colorScheme = useColorModeValue('primary', 'secondary')

  return (
    <Box
      mx={'auto'}
      bg={bg}
      maxH='100vh'
      overflowY={'auto'}
    >
      <VStack
        spacing={8}
        mx='auto'
        border='2px'
      >
        <Box
          bg={useColorModeValue('yellow.400', 'yellow.600')}
          w='full'
          fontWeight={'bold'}
          fontSize={'1.2em'}
          p={4}
        >
          This is Work in Progress
        </Box>
        <Header />

        <VStack
          spacing={4}
          p={4}
          w='full'
        >
          {allChapter.map((ch: Chapter, index: any) => {
            return (
              <Box
                px={4}
                py={4}
                w='full'
                key={index}
                border={'1px'}
                boxShadow={boxShadow}
              >
                <Flex w='full' h='full'>
                  <Text fontSize={'1.2em'} fontWeight={'bold'} fontStyle={'italic'} align="justify">{ch.name}</Text>
                  <Spacer />
                  <IconButton
                    mx={2}
                    size="sm"
                    aria-label="Table"
                    icon={<MdBackupTable size={24} />}
                    onClick={() => { uniqueSessionChapter(ch); startTableSession() }}
                    borderRadius={0}
                    boxShadow={boxShadow}
                    colorScheme={colorScheme}
                    isLoading={isLoading}
                  />
                  <IconButton
                    mx={2}
                    size="sm"
                    aria-label="Start"
                    icon={<VscDebugStart size={24} />}
                    onClick={() => { uniqueSessionChapter(ch); startSession() }}
                    borderRadius={0}
                    boxShadow={boxShadow}
                    colorScheme={colorScheme}
                    isLoading={isLoading}
                  />
                </Flex>
              </Box>
            )
          })}
        </VStack>


        <Box w='full' bg={'whiteAlpha.100'} px={8} py={4} borderTop={'2px'} my={'auto'}>
          <Button
            w='full'
            size={"lg"}
            colorScheme={colorScheme}
            boxShadow={boxShadow}
            borderRadius={0}
            onClick={() => {
              setSession(defaultSessionValue)
              onOpen()
            }}>
            Select multiple chapters
          </Button>
        </Box>
      </VStack>

      <Drawer placement="right" size="['full']" isOpen={isOpen} onClose={onClose}>
        <DrawerOverlay>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Select the vocabulary</DrawerHeader>

            <DrawerBody>
              <VStack>
                <Wrap p={4}>
                  {allChapter.map((ch: Chapter, index: any) => {
                    return (
                      <ChapterDisplay
                        key={index}
                        ch={ch.name}
                        onClick={() => updateSessionChapter(ch)}
                      />
                    )
                  })}
                </Wrap>

                <Text>
                  You have selected {session.selectedChapter.length} chapters.
                </Text>
                <Text>
                  You will be training on {nbWords} words.
                </Text>

                <HStack spacing={4}>
                  <Button
                    onClick={startSession}
                    isLoading={isLoading}
                    colorScheme={'blue'}
                    borderColor={useColorModeValue('black', 'white')}
                    borderWidth={1}
                    borderRadius={0}
                    boxShadow={boxShadow}
                  >
                    Start
                  </Button>

                  <Spacer />

                  <Button
                    onClick={startTableSession}
                    isLoading={isLoading}
                    colorScheme={'blue'}
                    borderColor={useColorModeValue('black', 'white')}
                    borderWidth={1}
                    borderRadius={0}
                    boxShadow={boxShadow}
                  >
                    Table
                  </Button>
                </HStack>
              </VStack>
            </DrawerBody>

          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </Box>
  )
}


export async function getServerSideProps(context: any) {
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=600'  // 10 minutes cache
  )

  let tableName = "en-no-json-01"
  if (context.query.lang) {
    console.log(context.query.lang)
    tableName = context.query.lang === "en" ? "en-no-json-01" : "uk-no-json-01"
  }

  const allChapters = await getAllChapter(context.query.lang)

  return {
    props: {
      allChapter: allChapters,
    }
  }
}