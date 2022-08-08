import { Button, Container, Grid, TextField } from "@material-ui/core";
import React, { ReactElement, useState } from "react";
import { useRouter } from "next/router";

import { useForm, SubmitHandler } from "react-hook-form";
import ImageDopZone from "../components/ImageDropZone";
import { API, Storage } from "aws-amplify";
import { v4 as uuidv4 } from "uuid";
import { createPost } from "../graphql/mutations";
import { CreatePostInput, CreatePostMutation } from "../API";
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/api";

interface IFormInput {
  title: string;
  content: string;
}
interface Props {}

export default function Create({}: Props): ReactElement {
  const [file, setFile] = useState<File>();
  const router = useRouter();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IFormInput>();
  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    if (file) {
      // user uploaded file
      try {
        const imagePath = uuidv4();
        await Storage.put(imagePath, file, {
          contentType: file.type,
        });

        const createNewPostInput: CreatePostInput = {
          title: data.title,
          contents: data.content,
          image: imagePath,
        };
        const createNewPost = (await API.graphql({
          query: createPost,
          variables: { input: createNewPostInput },
          authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        })) as { data: CreatePostMutation };

        router.push(`/post/${createNewPost.data.createPost.id}`);
      } catch (error) {
        console.log("Error uploading file: ", error);
      }
    } else {
      const createNewPostWithoutImageInput: CreatePostInput = {
        title: data.title,
        contents: data.content,
      };
      const createNewPostWithoutImage = (await API.graphql({
        query: createPost,
        variables: { input: createNewPostWithoutImageInput },
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
      })) as { data: CreatePostMutation };

      router.push(`/post/${createNewPostWithoutImage.data.createPost.id}`);
    }
  };

  return (
    <Container maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <Grid container spacing={4} direction="column">
          <Grid item>
            <TextField
              variant="outlined"
              id="title"
              label="Post Title"
              type="text"
              fullWidth
              error={errors.title ? true : false}
              helperText={errors.title ? errors.title.message : null}
              {...register("title", {
                required: { value: true, message: "Please enter a title." },
                maxLength: {
                  value: 120,
                  message: "Please enter a title that is under 121 characters ",
                },
              })}
            />
          </Grid>
          <Grid item>
            <TextField
              variant="outlined"
              id="content"
              label="Post Content"
              type="text"
              multiline
              fullWidth
              error={errors.content ? true : false}
              helperText={errors.content ? errors.content.message : null}
              {...register("content", {
                required: {
                  value: true,
                  message: "Please enter some content.",
                },
                maxLength: {
                  value: 1000,
                  message: "Please make sure your content is 1000 characters or less ",
                },
              })}
            />
          </Grid>
          <Grid item>
            <ImageDopZone file={file} setFile={setFile} />
          </Grid>

          <Button variant="contained" type="submit">
            Create Post
          </Button>
        </Grid>
      </form>
    </Container>
  );
}
