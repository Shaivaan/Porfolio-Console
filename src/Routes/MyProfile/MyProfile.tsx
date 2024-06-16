import { useEffect, useState } from "react";
import { Box, Avatar, Grid, IconButton, Button } from "@mui/material";
import { Edit } from "@mui/icons-material";
import "./MyProfile.css";
import { EditProfileForm, EditWorkShowCaseForm } from "../../Components/MyProfilePageComp/MyProfilePageComp";
import { firebaseFirestore, firebaseStorage } from "../../Firebase/firebase";
import { AddPrefixToKeys, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAlert, useButtonLoader, useZustandStore } from "../../Zustand/Zustand";
import { User } from "firebase/auth";
import { changesSavedMessage, generalErrorMessage, profilePictureCollectionStorage, userCollection } from "../../Zustand/Constants";
import { edit_profile_form_initial_values, showcase_form_initial_values } from "../../Components/FormsComp/InitialValues";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";


export const MyProfile = () => {
  const showAlert = useAlert();
  const buttonLoading = useButtonLoader();
  const [profileEditModal, setProfileEditModal] = useState(false);
  const handleDeleteModalOpen = () => setProfileEditModal(true);
  const handleDeleteModalClose = () => setProfileEditModal(false);

  const [workshowCaseEditModalOpen, setWorkshowCaseEditModalOpen] = useState(false);
  const handleShowCaseOpen = () => setWorkshowCaseEditModalOpen(true);
  const handleShowCaseClose = () => setWorkshowCaseEditModalOpen(false);
  const currentUserData = useZustandStore((state) => state.currentUserData);
  const [profilePageData,setProfilePageData] = useState<ProfileDataStateType>({...edit_profile_form_initial_values,showCase:showcase_form_initial_values});

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(firebaseFirestore, userCollection, (currentUserData as User).uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfilePageData(userData as ProfileDataStateType);
      } else {
        showAlert('User Not Found!','error')
      }
    } catch (error) {
      showAlert(generalErrorMessage,'error')
    }
  };

  const updateProfileData = async (updates: EditProfileFormIntiValueType | {showCase : ShowCaseFormType}) => {
    try {
      const userDocRef = doc(firebaseFirestore, userCollection, (currentUserData as User).uid);
      await updateDoc(userDocRef, updates as unknown as AddPrefixToKeys<string, any>);
      showAlert(changesSavedMessage,'success');
      fetchUserData();
      handleDeleteModalClose();
      handleShowCaseClose();
    } catch (error) {
      showAlert(generalErrorMessage,'error')
    } finally { 
      buttonLoading(false);
    }
  };

  const uploadFileAndUpdateProfilePicture = async (updates: EditProfileFormIntiValueType) => {
    const {profile_picture} = updates;
    try {
      const storageRef = ref(firebaseStorage, `${profilePictureCollectionStorage}/${(currentUserData as User).uid}/${(profile_picture as File).name}`);
      await uploadBytes(storageRef, profile_picture as File);
      const fileURL = await getDownloadURL(storageRef);
      await updateProfileData({...updates,profile_picture:fileURL});
    } catch (error) {
      console.log('Error uploading file and updating profile picture:', error);
      showAlert(generalErrorMessage,'error')
    }
  };

  const mainProfileEditFunction = async(updates: EditProfileFormIntiValueType)=>{
    buttonLoading(true);
    if(typeof updates.profile_picture === 'string'){
      await updateProfileData(updates);
    }else{
      await uploadFileAndUpdateProfilePicture(updates);
    }
  }

  const editWorkFlow=async(values: ShowCaseFormType)=>{
    buttonLoading(true);
    await updateProfileData({showCase : values})
  }

  useEffect(()=>{
    fetchUserData();
  },[])

  return (
    <Box className="global_uniform_vertical_style">
      <ProfileDisplay profileData={profilePageData}/>
      <PersonalInformation handleEditProfileModalOpen={handleDeleteModalOpen} profileData={profilePageData}/>
      <WorkShowCase  handleOpenWorkShowCaseModalOpen={handleShowCaseOpen} profileData={profilePageData}/>
      <EditProfileForm
        isOpen={profileEditModal}
        updateProfileData={mainProfileEditFunction}
        handleClose={handleDeleteModalClose}
        profileData={profilePageData}
        profileFormInitialValues={{
          first_name:profilePageData.first_name,
          last_name:profilePageData.last_name,
          profile_picture:profilePageData.profile_picture,
          email:profilePageData.email,
          about:profilePageData.about
        }}
      />
      <EditWorkShowCaseForm updateProfileData={(values:ShowCaseFormType)=>editWorkFlow(values)} workShowCaseData={profilePageData.showCase} handleClose={handleShowCaseClose} isOpen={workshowCaseEditModalOpen} />
    </Box>
  );
};

const DisplayValueWithLabel = ({
  lable,
  value,
  isUsedForNavigation = false,
}: DisplayValueWithLabelType) => {
  return (
    <Box className="global_uniform_vertical_style" style={{ rowGap: "0.2rem" }}>
      <Box color={"grey"}>{lable}</Box>
      {!isUsedForNavigation ? (
        <Box>{value}</Box>
      ) : (
        <Button
          variant="text"
          color="primary"
          style={{ width: "5rem", textTransform: "none" }}
          target="_blank"
          href={value as string}
        >
          Visit
        </Button>
      )}
    </Box>
  );
};

const ProfileDisplay = ({profileData}:ProfileDisplaySectionType) => {
  const {first_name,last_name,email,profile_picture} = profileData;
  return (
    <Box className="profileDisplayParent gridBackground">
      <Avatar className="avatar_style" src={profile_picture as unknown as undefined}/>
      <Box
        className="global_uniform_vertical_style"
        style={{ rowGap: "0.2rem" }}
      >
        <Box className="nameHead">{first_name} {last_name}</Box>
        <Box className="worker">Web Developer</Box>
        <Box>{email}</Box>
      </Box>
    </Box>
  );
};





const PersonalInformation = ({
  handleEditProfileModalOpen,
  profileData
}: PersonalInformationType & ProfileDisplaySectionType) => {
  const {first_name,last_name,email,about} = profileData
  return (
    <Box
      className="gridBackground global_uniform_vertical_style"
      style={{ rowGap: "1.5rem" }}
    >
      <Box className="global_justify_space_between" width={"100%"}>
        <Box fontSize={"1.2rem"}>Personal Information</Box>
        <IconButton onClick={() => handleEditProfileModalOpen()}>
          <Edit color="secondary" />
        </IconButton>
      </Box>
      <Grid container style={{ rowGap: "1.5rem" }}>
        <Grid item lg={3} sm={6} xs={12}>
          <DisplayValueWithLabel lable="First Name" value={first_name} />
        </Grid>
        <Grid item lg={9} sm={6} xs={12}>
          <DisplayValueWithLabel lable="Last Name" value={last_name} />
        </Grid>
        <Grid item lg={3} sm={6} xs={12}>
          <DisplayValueWithLabel lable="Email" value={email} />
        </Grid>
        <Grid item lg={9} sm={6} xs={12}>
          <DisplayValueWithLabel lable="About Me" value={about} />
        </Grid>
      </Grid>
    </Box>
  );
};

const WorkShowCase = ({profileData,handleOpenWorkShowCaseModalOpen}:WorkShowCaseFormType & ProfileDisplaySectionType) => {
  const {showCase:{github,instagram,linked_in,resume,youtube}} = profileData;
  return (
    <Box
      className="gridBackground global_uniform_vertical_style"
      style={{ rowGap: "1.5rem" }}
    >
      <Box className="global_justify_space_between" width={"100%"}>
        <Box fontSize={"1.2rem"}>Work Showcase</Box>
        <IconButton onClick={handleOpenWorkShowCaseModalOpen}>
          <Edit color="secondary" />
        </IconButton>
      </Box>
      <Grid container style={{ rowGap: "1.5rem" }}>
        <Grid item lg={3} sm={6} xs={12}>
          <DisplayValueWithLabel
            lable="Linked In"
            value={linked_in}
            isUsedForNavigation={true}
          />
        </Grid>
        <Grid item lg={9} sm={6} xs={12}>
          <DisplayValueWithLabel
            lable="Resume"
            value={resume}
            isUsedForNavigation={true}
          />
        </Grid>
        <Grid item lg={3} sm={6} xs={12}>
          <DisplayValueWithLabel
            lable="Github"
            value={github}
            isUsedForNavigation={true}
          />
        </Grid>
        <Grid item lg={9} sm={6} xs={12}>
          <DisplayValueWithLabel
            lable="Youtube"
            value={youtube}
            isUsedForNavigation={true}
          />
        </Grid>
        <Grid item lg={3} sm={6} xs={12}>
          <DisplayValueWithLabel
            lable="Instagram"
            value={instagram}
            isUsedForNavigation={true}
          />
        </Grid>
      </Grid>
    </Box>
  );
};


