import { writable, get } from 'svelte/store';
import { sendEror } from '$lib/func/sendEror.js';
import { calcX } from '$lib/func/calcX.svelte';

// This will hold miData.data.usersPermissionsUser.data.attributes.projects_1s.data
export const projects = writable([]); 
// This will hold miData.data.usersPermissionsUser.data.id
export const userId = writable(null); 

export function getProjectData(id, thing, uid) {
    const projectList = get(projects);
    if (projectList && projectList.length > 0) {
      for (let i = 0; i < projectList.length; i++) {
                   
        if (projectList[i].id == id) {
          if (thing == 'pn') {
            return projectList[i].attributes.projectName;
          } else if (thing == 'pp') {

            let srcP = '';
            if (projectList[i].attributes.profilePic.data != null) {
              if (
                projectList[i].attributes.profilePic.data.attributes.formats
                  ?.thumbnail
              ) {
                srcP =
                  projectList[i].attributes.profilePic.data.attributes.formats
                    .thumbnail.url;
              } else {
                srcP = projectList[i].attributes.profilePic.data.attributes.url;
              }
            } else {
              srcP =
                'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
            }
            return srcP;
          } else if (thing == 'noof') {
            return projectList[i].attributes.user_1s.data.length;
          } else if (thing == 'uids') {
            return projectList[i].attributes.user_1s.data.map((c) => c.id);
          } else if (thing == 'us') {
            return projectList[i].attributes.user_1s.data;
          } else if (thing == 'upic') {
            for (
              let t = 0;
              t < projectList[i].attributes.user_1s.data.length;
              t++
            ) {
              if (projectList[i].attributes.user_1s.data[t].id == uid) {
                let pic = null;
                if (
                  projectList[i].attributes.user_1s.data[t].attributes.profilePic
                    ?.data !== null
                ) {
                  pic =
                    projectList[i].attributes.user_1s.data[t].attributes.profilePic
                      .data.attributes.formats.thumbnail.url;
                } else {
                  pic = null;
                }
                return pic;
              }
            }
          } else if (thing == 'un') {
            for (
              let t = 0;
              t < projectList[i].attributes.user_1s.data.length;
              t++
            ) {
              if (projectList[i].attributes.user_1s.data[t].id == uid) {
                return projectList[i].attributes.user_1s.data[t].attributes
                  .username;
              }
            }
          } else if (thing == 'restime') {
            return projectList[i].attributes.restime;
          } else if (thing == 'finishDate') {
            const restime = projectList[i].attributes.restime;
            const x = calcX(restime);
            return new Date(Date.now() + x);
          }
        }
      }
    } else {
      const currentUserId = get(userId);
      if(currentUserId) {
        sendEror(currentUserId, thing, 2000);
      }
      return null;
      //why am i here send error report to telegram
    }
    return null; // Should return something if project not found
  }
