import React from "react";
import Modal from "react-modal";
import "./styles/Windows.css";

// Set the app element for react-modal
Modal.setAppElement("#root");

interface PopupProps {
  isVisible: boolean;
  setIsVisible: (v: boolean) => void;
  children?: React.ReactNode;
}

export const Popup = (props: PopupProps) => {
  const { isVisible, setIsVisible, children } = props;
  const [toOpen, setToOpen] = React.useState(true);

  const closeModal = () => {
    setToOpen(false);
    setTimeout(() => {
      setIsVisible(false);
      setToOpen(true);
    }, 200);
  };
  return (
    <Modal
      isOpen={isVisible}
      onRequestClose={closeModal}
      className={`modal ${toOpen ? "open" : "close"}`}
      overlayClassName="overlay"
    >
      <button onClick={closeModal} className="closeBtn">
        x
      </button>
      {children}
    </Modal>
  );
};

export default Popup;
