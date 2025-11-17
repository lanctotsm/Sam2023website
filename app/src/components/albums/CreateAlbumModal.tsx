import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Album name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate(name.trim());
      setName('');
      onClose();
      toast({
        title: 'Album created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to create album', err);
      setError('Unable to create album. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="gray.900">
        <ModalHeader>Create a New Album</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isInvalid={Boolean(error)}>
            <FormLabel>Album Name</FormLabel>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Japan 2024"
            />
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button colorScheme="teal" onClick={handleSubmit} isLoading={isSubmitting}>
            Create Album
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateAlbumModal;
